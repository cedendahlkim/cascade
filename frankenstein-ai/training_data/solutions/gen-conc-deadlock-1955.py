# Task: gen-conc-deadlock-1955 | Score: 100% | 2026-02-17T20:08:57.661252

def solve():
    p, r = map(int, input().split())
    total = list(map(int, input().split()))
    allocation = []
    request = []
    for _ in range(p):
        line = input().split('|')
        allocation.append(list(map(int, line[0].split())))
        request.append(list(map(int, line[1].split())))

    available = [total[i] - sum(allocation[j][i] for j in range(p)) for i in range(r)]
    
    finish = [False] * p
    safe_sequence = []
    
    work = available[:]
    
    while True:
        found = False
        for i in range(p):
            if not finish[i] and all(request[i][j] <= work[j] for j in range(r)):
                work = [work[j] + allocation[i][j] for j in range(r)]
                safe_sequence.append(i)
                finish[i] = True
                found = True
                break
        if not found:
            break
    
    if all(finish):
        print("SAFE")
    else:
        deadlocked = [i for i in range(p) if not finish[i]]
        print(' '.join(f'P{i}' for i in deadlocked))

solve()