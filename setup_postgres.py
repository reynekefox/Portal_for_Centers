# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '109.73.199.60'
USERNAME = 'root'
PASSWORD = 'eaACMy*w+5L+_w'

def setup_postgres():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("Connected!")
        
        # Install PostgreSQL
        print("\n>>> Installing PostgreSQL...")
        stdin, stdout, stderr = client.exec_command('apt install -y postgresql postgresql-contrib', timeout=180)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print("PostgreSQL installed" if exit_status == 0 else f"Error: {output[-500:]}")
        
        # Start PostgreSQL
        print("\n>>> Starting PostgreSQL...")
        stdin, stdout, stderr = client.exec_command('systemctl start postgresql && systemctl enable postgresql', timeout=30)
        stdout.channel.recv_exit_status()
        
        # Create database and user
        print("\n>>> Creating database neurotrainer...")
        cmds = [
            "sudo -u postgres psql -c \"CREATE USER portal WITH PASSWORD 'portal123';\"",
            "sudo -u postgres psql -c \"CREATE DATABASE neurotrainer OWNER portal;\"",
            "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE neurotrainer TO portal;\""
        ]
        for cmd in cmds:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='replace')
            error = stderr.read().decode('utf-8', errors='replace')
            print(f"  {output or error or 'OK'}")
        
        # Create .env file
        print("\n>>> Creating .env file...")
        env_content = '''DATABASE_URL=postgresql://portal:portal123@localhost:5432/neurotrainer
NODE_ENV=production
PORT=5001
'''
        cmd = f"echo '{env_content}' > /var/www/portal/ScreenCreator/.env"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        stdout.channel.recv_exit_status()
        
        # Verify .env
        stdin, stdout, stderr = client.exec_command('cat /var/www/portal/ScreenCreator/.env', timeout=30)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='replace')
        print(f"  .env created:\n{output}")
        
        # Restart app
        print("\n>>> Restarting app...")
        stdin, stdout, stderr = client.exec_command('cd /var/www/portal/ScreenCreator && pm2 restart portal', timeout=60)
        stdout.channel.recv_exit_status()
        
        print("\n=== PostgreSQL setup completed! ===")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    setup_postgres()
