# Task: gen-pattern-pyramid-5892 | Score: 100% | 2026-02-15T11:37:21.537208

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))