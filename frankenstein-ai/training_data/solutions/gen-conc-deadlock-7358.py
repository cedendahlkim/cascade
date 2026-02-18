# Task: gen-conc-deadlock-7358 | Score: 100% | 2026-02-17T20:31:24.610061

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
    
    while True:
        found = False
        for i in range(p):
            if not finish[i]:
                can_finish = True
                for j in range(r):
                    if request[i][j] > available[j]:
                        can_finish = False
                        break
                
                if can_finish:
                    safe_sequence.append(i)
                    available = [available[j] + allocation[i][j] for j in range(r)]
                    finish[i] = True
                    found = True
        
        if not found:
            break
    
    if all(finish):
        print("SAFE")
    else:
        deadlocked = [i for i in range(p) if not finish[i]]
        print(' '.join(f'P{i}' for i in deadlocked))

solve()