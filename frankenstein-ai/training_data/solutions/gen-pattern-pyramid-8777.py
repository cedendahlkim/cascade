# Task: gen-pattern-pyramid-8777 | Score: 100% | 2026-02-13T20:17:35.469449

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))