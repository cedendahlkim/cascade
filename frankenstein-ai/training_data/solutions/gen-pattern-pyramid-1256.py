# Task: gen-pattern-pyramid-1256 | Score: 100% | 2026-02-13T16:27:52.365581

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))