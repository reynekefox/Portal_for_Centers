import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def fix_server():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        commands = [
            "cd /var/www/portal/ScreenCreator && npm install",  # Install ALL dependencies including devDeps
            "pm2 restart portal",
            "sleep 5",
            "pm2 list",
            "netstat -tlnp | grep 5001"
        ]
        
        for cmd in commands:
            print(f"\n>>> Executing: {cmd}")
            _, stdout, stderr = client.exec_command(cmd, timeout=120)
            exit_code = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', errors='replace')
            err = stderr.read().decode('utf-8', errors='replace')
            if out:
                print(out)
            if err:
                print(f"STDERR: {err}")
            print(f"Exit code: {exit_code}")
        
        client.close()
        print("\n=== DONE ===")
        return True
    except Exception as e:
        print(f"Error: {e}")
        client.close()
        return False

if __name__ == "__main__":
    fix_server()
