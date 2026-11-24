---
id: vercel-deployment
assignee: Junyu
sprint: 4
estimate_hours: 4
---

# Vercel Deployment & Production Integration

## Description

The Smart Scheduling App needs a stable and accessible deployment for the final product demonstration. While the application has previously been deployed to Vercel, the deployed version may not contain the latest changes from the GitHub repository.

This task focuses on updating and maintaining the Vercel deployment, configuring Google OAuth authentication, and verifying that the frontend, backend, and agent service can communicate correctly in the deployed environment.

Additionally, the deployment must support reliable database connectivity and data persistence. Since multiple backend services and agent tools depend on course information, degree requirements, student preferences, and scheduling data, the deployed application must ensure that these tools can securely access the required databases.

The goal is to ensure that the latest working version of the application can be accessed through a public URL, supports the necessary database-dependent features, and is ready for the final demonstration.

## Specs

The Vercel deployment and integration task consists of:

1. **Vercel Deployment Configuration**
   - Verify that the Vercel project is connected to the correct GitHub repository.
   - Ensure that the deployment configuration supports the application's frontend and backend structure.
   - Update the deployed application to include the latest integrated changes.
   - Verify that the application builds and deploys successfully.

2. **Environment Variables and Google OAuth**
   - Configure the required environment variables in Vercel.
   - Verify the Google OAuth Client ID and Client Secret configuration.
   - Ensure that OAuth redirect URIs match the deployed application.
   - Keep sensitive credentials out of the GitHub repository.

3. **Frontend and Backend Integration**
   - Verify that the deployed React frontend can communicate with the Node.js backend.
   - Ensure that API requests use the correct production endpoints.
   - Verify that authentication requests and responses are handled correctly.
   - Check for deployment-specific errors, including incorrect API paths and environment configuration.

4. **Agent Service Integration**
   - Verify that the backend can communicate with the agent service in the deployed environment.
   - Ensure that agent requests and responses are handled correctly.
   - Confirm that deployment configuration supports the application's scheduling workflow.

5. **Final Demo Readiness**
   - Verify that the deployed application is accessible through a public URL.
   - Confirm that the deployment contains the latest working version of the application.
   - Test the main user workflow in the deployed environment.
   - Identify and resolve deployment-related issues before the final demonstration.

6. **Database Connectivity and Configuration**
   - Identify the databases required by the backend and agent services.
   - Configure the necessary database connections in the deployed environment.
   - Ensure that database connection strings and credentials are managed securely through environment variables.
   - Verify that deployed services can connect to the required databases.
   - Avoid relying on Vercel's temporary filesystem for persistent application data.
   - Ensure that database connections remain functional after redeployment.

7. **Database Access for Agent Tools**
   - Identify which databases and data sources are required by each agent tool.
   - Ensure that course-related tools can retrieve course information and prerequisites from the appropriate database.
   - Ensure that degree requirement tools can access the required degree information, including vector database content when applicable.
   - Verify that scheduling tools can retrieve student preferences, completed courses, and existing schedule information.
   - Ensure that agent tools access databases through appropriate backend APIs or authorized database connections.
   - Handle missing records and database query failures appropriately.

8. **Data Persistence and Database Management**
   - Ensure that user information and questionnaire responses are stored persistently.
   - Verify that student preferences and completed course information can be retrieved across sessions.
   - Ensure that conversation history and generated schedules can be stored and retrieved when required.
   - Verify that persistent data remains available after Vercel redeployment.
   - Ensure that database credentials are not exposed to the frontend.
   - Handle database connection failures without crashing the entire application.

## Requirements

1. **Public Accessibility**: The application must be accessible through a working Vercel URL.

2. **Deployment Updates**: The Vercel project must support deploying the latest integrated application changes.

3. **Environment Configuration**: Required production environment variables must be configured correctly without exposing sensitive credentials.

4. **Google OAuth**: Google authentication must work correctly in the deployed environment.

5. **API Communication**: The frontend must communicate with the backend using the correct production API endpoints.

6. **Agent Connectivity**: The backend must be able to communicate with the agent service when the service is available.

7. **Error Handling**: Deployment-related failures must be identifiable through logs or appropriate error messages.

8. **Build Stability**: The deployment process must complete without build or configuration errors.

9. **Database Connectivity**: The deployed backend and agent services must be able to access the databases required for their functionality.

10. **Database Configuration**: Database connection information and credentials must be configured securely using environment variables.

11. **Agent Tool Database Access**: Each database-dependent agent tool must be able to retrieve the information required for its operations through authorized database connections or backend APIs.

12. **Data Persistence**: User information, preferences, conversation history, and generated schedules must remain available across application restarts and redeployments.

13. **Database Error Handling**: Database connection failures and query errors must be handled appropriately without causing the entire application to crash.

14. **Database Security**: Sensitive database credentials must not be exposed to the frontend or committed to the GitHub repository.

## Acceptance Criteria

- **AC1**: The Smart Scheduling App can be opened successfully using its public Vercel URL.
- **AC2**: The deployed application contains the latest intended version of the integrated codebase.
- **AC3**: All required production environment variables are configured in Vercel without exposing secrets in source control.
- **AC4**: Google OAuth authentication completes successfully using the production configuration.
- **AC5**: The deployed frontend can send requests to the backend and receive valid responses.
- **AC6**: The backend can successfully communicate with the deployed agent service and receive a valid response.
- **AC7**: The main scheduling workflow can be tested in the deployed application once the required features are integrated.
- **AC8**: A new deployment can be completed successfully without manual changes to application source code.
- **AC9**: The deployed application is ready for verification and final demo preparation by Monday, November 30, 2026.
- **AC10**: The deployed backend can successfully connect to the required databases using production environment configuration.
- **AC11**: Database-dependent agent tools can retrieve the required course, degree requirement, student, and scheduling information through their designated data access interfaces.
- **AC12**: User preferences, conversation history, and generated schedules remain available after application redeployment.
- **AC13**: Database credentials are securely configured and are not exposed through frontend code or the GitHub repository.
- **AC14**: Database connection failures and query errors are handled gracefully and provide appropriate error information without crashing the application.
- **AC15**: Database-dependent features, including course retrieval and schedule generation, function correctly in the deployed environment.

## Tests

1. **Deployment Smoke Test**
   - Open the public Vercel URL.
   - Verify that the application loads without deployment-related errors.
   - Confirm that the expected frontend interface is displayed.

2. **Google OAuth Test**
   - Initiate Google login from the deployed application.
   - Verify successful authentication and redirection.
   - Confirm that the application handles the authenticated session correctly.

3. **Frontend-Backend Communication Test**
   - Trigger an API request from the deployed frontend.
   - Verify that the backend receives the request and returns the expected response.

4. **Agent Integration Test**
   - Submit a scheduling-related request through the application.
   - Verify that the backend can reach the agent service.
   - Confirm that the response is returned to the application correctly.

5. **Redeployment Test**
   - Deploy the latest integrated code.
   - Verify that the deployment succeeds.
   - Confirm that the updated application is accessible through the production URL.

6. **Database Connectivity Test**
   - Verify that the deployed backend can establish connections to the required databases.
   - Confirm that database connection settings are correctly configured through environment variables.
   - Verify that database queries return expected results.

7. **Agent Tool Database Access Test**
   - Trigger agent tools that require course, degree requirement, or student information.
   - Verify that each tool can retrieve the required data from its designated database or backend API.
   - Confirm that retrieved data can be used correctly in the scheduling workflow.

8. **Data Persistence Test**
   - Save user preferences or scheduling information through the deployed application.
   - Verify that the saved information can be retrieved successfully.
   - Redeploy the application and confirm that previously saved data remains available.

9. **Database Error Handling Test**
   - Simulate a database connection failure or invalid database query in a controlled test environment.
   - Verify that the application handles the error without crashing.
   - Confirm that appropriate error messages or logs are generated without exposing sensitive credentials.

10. **Database-Dependent Workflow Test**
    - Complete the questionnaire in the deployed application.
    - Verify that the required student and course information can be retrieved.
    - Submit a scheduling request and confirm that the agent can access the required data.
    - Verify that generated scheduling results can be returned and displayed correctly.

## Deliverables

- Updated Vercel deployment configuration, if required.
- Configured production environment variables.
- Accessible public deployment URL.
- Verified frontend, backend, and agent service integration.
- Deployment-related documentation and test evidence.
- Documented database connection configuration and required environment variables.
- Verified database access for backend services and agent tools.
- Evidence that persistent application data remains available after redeployment.
- Database integration and error-handling test results.
