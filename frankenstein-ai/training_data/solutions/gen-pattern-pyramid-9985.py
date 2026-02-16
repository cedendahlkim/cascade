# Task: gen-pattern-pyramid-9985 | Score: 100% | 2026-02-13T11:35:23.365752

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))