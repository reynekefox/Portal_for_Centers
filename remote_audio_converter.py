import paramiko
import os
import io
import sys
import time

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def convert_audio_remotely():
    host = "109.73.199.60"
    user = "root"
    password = "eaACMy*w+5L+_w"
    
    local_audio_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"
    remote_temp_dir = "/root/temp_audio_conversion"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {host}...")
        client.connect(host, username=user, password=password, timeout=15)
        print("Connected!")
        
        sftp = client.open_sftp()
        
        # 1. Prepare Remote Directory
        print(f"Creating remote directory: {remote_temp_dir}")
        client.exec_command(f"rm -rf {remote_temp_dir}") # Clean start
        client.exec_command(f"mkdir -p {remote_temp_dir}")
        
        # 2. Upload WAV files
        print("Uploading .wav files...")
        wav_files = [f for f in os.listdir(local_audio_dir) if f.endswith('.wav')]
        if not wav_files:
            print("No .wav files found locally.")
            return

        for f in wav_files:
            local_path = os.path.join(local_audio_dir, f)
            remote_path = f"{remote_temp_dir}/{f}"
            print(f"Uploading {f}...")
            sftp.put(local_path, remote_path)
            
        print(f"Uploaded {len(wav_files)} files.")
        
        # 3. Install ffmpeg (if needed) and Convert
        print("\nInstalling ffmpeg and converting files on server...")
        
        # Combined command to ensure environment persistence within the shell
        cmd = f"""
        export DEBIAN_FRONTEND=noninteractive
        if ! command -v ffmpeg &> /dev/null; then
            echo "Installing ffmpeg..."
            apt-get update && apt-get install -y ffmpeg
        fi
        
        cd {remote_temp_dir}
        echo "Starting conversion..."
        for f in *.wav; do
            if [ -f "$f" ]; then
                ffmpeg -y -i "$f" -acodec libmp3lame -q:a 2 "${{f%.wav}}.mp3" < /dev/null
                echo "Converted: $f"
            fi
        done
        """
        
        stdin, stdout, stderr = client.exec_command(cmd, timeout=600) # 10 min timeout
        
        # Stream output
        while not stdout.channel.exit_status_ready():
            if stdout.channel.recv_ready():
                print(stdout.channel.recv(1024).decode('utf-8', 'ignore'), end='')
            time.sleep(0.5)
            
        print(stdout.read().decode('utf-8', 'ignore')) # Final flush
        err = stderr.read().decode('utf-8', 'ignore')
        if err:
            print(f"STDERR: {err}")
            
        # 4. Download MP3 files
        print("\nDownloading converted .mp3 files...")
        remote_files = sftp.listdir(remote_temp_dir)
        mp3_files = [f for f in remote_files if f.endswith('.mp3')]
        
        download_count = 0
        for f in mp3_files:
            remote_path = f"{remote_temp_dir}/{f}"
            local_path = os.path.join(local_audio_dir, f)
            print(f"Downloading {f}...")
            sftp.get(remote_path, local_path)
            download_count += 1
            
        print(f"Downloaded {download_count} .mp3 files.")
        
        # 5. Cleanup
        print("Cleaning up remote server...")
        client.exec_command(f"rm -rf {remote_temp_dir}")
        
        sftp.close()
        client.close()
        print("\n=== SUCCESS: Audio conversion complete! ===")
        return True

    except Exception as e:
        print(f"\nERROR: {e}")
        try:
            client.close()
        except:
            pass
        return False

if __name__ == "__main__":
    convert_audio_remotely()
