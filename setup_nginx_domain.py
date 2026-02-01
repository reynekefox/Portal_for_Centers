# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

NGINX_CONFIG = '''server {
    listen 80;
    server_name neurotrainer.life www.neurotrainer.life;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
'''

def setup_nginx_config():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        # Create nginx config
        print("\n>>> Creating nginx config for neurotrainer.life")
        config_escaped = NGINX_CONFIG.replace("'", "'\\''")
        cmd = f"echo '{config_escaped}' > /etc/nginx/sites-available/neurotrainer.life"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        stdout.channel.recv_exit_status()
        
        # Enable site
        print(">>> Enabling site")
        stdin, stdout, stderr = client.exec_command(
            'ln -sf /etc/nginx/sites-available/neurotrainer.life /etc/nginx/sites-enabled/',
            timeout=30
        )
        stdout.channel.recv_exit_status()
        
        # Remove default site
        print(">>> Removing default site")
        stdin, stdout, stderr = client.exec_command(
            'rm -f /etc/nginx/sites-enabled/default',
            timeout=30
        )
        stdout.channel.recv_exit_status()
        
        # Test nginx config
        print(">>> Testing nginx config")
        stdin, stdout, stderr = client.exec_command('nginx -t', timeout=30)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        print(output or error)
        
        if exit_status != 0:
            print("ERROR: nginx config test failed!")
            return
        
        # Reload nginx
        print(">>> Reloading nginx")
        stdin, stdout, stderr = client.exec_command('systemctl reload nginx', timeout=30)
        stdout.channel.recv_exit_status()
        
        print("\n=== Nginx configured for neurotrainer.life! ===")
        print("Now you need to point your domain DNS A record to: 109.73.199.60")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    setup_nginx_config()
