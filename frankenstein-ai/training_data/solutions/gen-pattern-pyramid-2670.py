# Task: gen-pattern-pyramid-2670 | Score: 100% | 2026-02-13T13:42:52.185726

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))