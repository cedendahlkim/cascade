# Task: gen-pattern-pyramid-5789 | Score: 100% | 2026-02-13T14:19:30.328813

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))