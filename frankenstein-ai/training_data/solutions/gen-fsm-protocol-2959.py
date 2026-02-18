# Task: gen-fsm-protocol-2959 | Score: 100% | 2026-02-17T19:56:03.711707

import sys

def main():
    lines = sys.stdin.readlines()
    
    request_line = lines[0].strip()
    parts = request_line.split()
    method = parts[0]
    path = parts[1]
    
    headers = {}
    body_start = 1
    for i in range(1, len(lines)):
        line = lines[i].strip()
        if line == "":
            body_start = i + 1
            break
        else:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip()] = value.strip()
            
    body = "".join(lines[body_start:]).strip()
    
    num_headers = len(headers)
    body_length = len(body)
    
    print(f"method:{method} path:{path} headers:{num_headers} body:{body_length}")

if __name__ == "__main__":
    main()