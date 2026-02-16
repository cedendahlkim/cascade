# Task: gen-pattern-pyramid-8230 | Score: 100% | 2026-02-13T18:51:23.715644

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))