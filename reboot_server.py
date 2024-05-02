import sys
import winrm

def reboot_windows_server(host, username, password):
    session = winrm.Session(host, auth=(username, password), transport='http')
    result = session.run_cmd('shutdown /r /t 0')
    print(result.std_out)

if __name__ == "__main__":
    host = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    reboot_windows_server(host, username, password)
