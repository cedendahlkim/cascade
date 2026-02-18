# Task: gen-conc-deadlock-2296 | Score: 100% | 2026-02-17T20:35:30.363545

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
                    for j in range(r):
                        available[j] += allocation[i][j]
                    finish[i] = True
                    found = True
        
        if not found:
            break
    
    if all(finish):
        print("SAFE")
    else:
        deadlocked = []
        for i in range(p):
            if not finish[i]:
                deadlocked.append(f"P{i}")
        print(" ".join(deadlocked))

solve()