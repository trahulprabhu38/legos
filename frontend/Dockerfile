FROM nginx:latest

WORKDIR /app

RUN rm -rf /usr/share/nginx/html/*

COPY index.html /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx","-g","daemon off;"]