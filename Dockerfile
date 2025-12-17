FROM node:18-alpine

WORKDIR /usr/src/app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port (Render will set PORT env var)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

