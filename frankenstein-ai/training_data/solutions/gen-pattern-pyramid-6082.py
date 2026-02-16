# Task: gen-pattern-pyramid-6082 | Score: 100% | 2026-02-13T14:42:30.094482

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))