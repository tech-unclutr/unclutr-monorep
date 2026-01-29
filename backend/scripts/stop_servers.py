import subprocess
import os
import signal
import time
import sys

def run_command(command):
    try:
        output = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT)
        return output.decode('utf-8').strip()
    except subprocess.CalledProcessError:
        return ""

def kill_process_on_port(port):
    print(f"Checking port {port}...")
    # lsof -t -i:port returns only PID
    pids = run_command(f"lsof -t -i:{port}")
    
    if pids:
        for pid in pids.split('\n'):
            if pid.strip():
                print(f"  Killing process {pid} on port {port}")
                try:
                    os.kill(int(pid), signal.SIGKILL)
                except ProcessLookupError:
                    pass
                except Exception as e:
                    print(f"  Error killing {pid}: {e}")
        return True
    return False

def kill_ngrok():
    print("Checking for ngrok processes...")
    pids = run_command("ps aux | grep ngrok | grep -v grep | awk '{print $2}'")
    
    if pids:
        for pid in pids.split('\n'):
            if pid.strip():
                print(f"  Killing ngrok process {pid}")
                try:
                    os.kill(int(pid), signal.SIGKILL)
                except ProcessLookupError:
                    pass
                except Exception as e:
                    print(f"  Error killing ngrok {pid}: {e}")
        return True
    return False

def main():
    print("Stopping development servers...")
    
    # Kill ports
    killed_8000 = kill_process_on_port(8000)
    killed_3000 = kill_process_on_port(3000)
    
    # Kill ngrok
    killed_ngrok = kill_ngrok()
    
    if killed_8000 or killed_3000 or killed_ngrok:
        print("Waiting for processes to terminate...")
        time.sleep(2)
        print("Cleanup complete.")
    else:
        print("No running servers found.")

if __name__ == "__main__":
    main()
