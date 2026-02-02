# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def get_ssl():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=60)
        print("Connected!")
        
        # Get SSL certificate using certbot
        print("\n>>> Getting SSL certificate...")
        cmd = 'certbot --nginx -d neurotrainer.life -d www.neurotrainer.life --non-interactive --agree-tos --email admin@neurotrainer.life'
        stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        
        print(output[-1500:] if output else "")
        if error:
            print(f"\n{error[-1000:]}")
        print(f"\nExit status: {exit_status}")
        
        if exit_status == 0:
            print("\n=== SSL Certificate obtained successfully! ===")
            print("Site is now available at: https://neurotrainer.life")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    get_ssl()
