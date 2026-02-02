import paramiko
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def fix_ffmpeg():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        # Commands to fix environment
        commands = [
            "export DEBIAN_FRONTEND=noninteractive",
            "apt-get update",
            "apt-get install -y ffmpeg",
            "ffmpeg -version" # Verification
        ]
        
        for cmd in commands:
            print(f"\n>>> Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            
            # Wait for command to finish and print output
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', 'ignore')
            err = stderr.read().decode('utf-8', 'ignore')
            
            if out: print(out)
            if err: print(f"STDERR: {err}")
            print(f"Exit code: {exit_status}")
            
            if exit_status != 0 and cmd != "ffmpeg -version":
                print("Command failed, stopping.")
                return False

        print("\n=== FFMPEG INSTALLED SUCCESSFULLY ===")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    fix_ffmpeg()
