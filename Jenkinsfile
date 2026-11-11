pipeline {
    agent any

    environment {
        DOCKERHUB        = credentials('dockerhub-credentials')   // exposes DOCKERHUB_USR / DOCKERHUB_PSW
        IMAGE_TAG        = "${BUILD_NUMBER}"
        APP_VERSION      = '1.0'
        COMPOSE_PROJECT_NAME = 'taskflow'
        FRONTEND_PORT    = '3000'
        BACKEND_PORT     = '8090'
        // Jenkins runs in a container, so the deployed app is reached through the Docker host
        HEALTH_URL       = "http://host.docker.internal:8090/actuator/health"
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    // Docker image names must be lowercase, whatever case the username was saved in
                    env.DOCKERHUB_USER = env.DOCKERHUB_USR.toLowerCase()
                }
                echo "Building ${APP_VERSION} · build #${BUILD_NUMBER} · ${env.GIT_COMMIT}"
            }
        }

        stage('Backend Test') {
            steps {
                dir('backend') {
                    sh 'mvn -B test'
                }
            }
            post {
                always {
                    junit 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend Test & Build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm test'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                // Images are tagged with the build number; BUILD_NUMBER / GIT_COMMIT are baked in
                // so /api/system/info (and the UI footer) show where the running app came from.
                sh 'docker compose build'
                sh '''
                    docker tag ${DOCKERHUB_USER}/taskflow-backend:${IMAGE_TAG}  ${DOCKERHUB_USER}/taskflow-backend:latest
                    docker tag ${DOCKERHUB_USER}/taskflow-frontend:${IMAGE_TAG} ${DOCKERHUB_USER}/taskflow-frontend:latest
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'printf %s "$DOCKERHUB_PSW" | docker login -u "$DOCKERHUB_USER" --password-stdin'
                sh '''
                    docker push ${DOCKERHUB_USER}/taskflow-backend:${IMAGE_TAG}
                    docker push ${DOCKERHUB_USER}/taskflow-backend:latest
                    docker push ${DOCKERHUB_USER}/taskflow-frontend:${IMAGE_TAG}
                    docker push ${DOCKERHUB_USER}/taskflow-frontend:latest
                '''
            }
            post {
                always {
                    sh 'docker logout || true'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                // The backend needs a little time to boot, so retry for up to ~2 minutes
                sh '''
                    for i in $(seq 1 24); do
                        if curl -fsS "$HEALTH_URL" | grep -q '"status":"UP"'; then
                            echo "Application is healthy"; exit 0
                        fi
                        echo "Waiting for application... ($i/24)"; sleep 5
                    done
                    echo "Health check failed"; exit 1
                '''
            }
        }
    }

    post {
        success { echo "Build #${BUILD_NUMBER} deployed: http://localhost:${FRONTEND_PORT}" }
        failure { echo "Build #${BUILD_NUMBER} failed - see the failing stage above" }
    }
}
