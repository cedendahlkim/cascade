# Task: gen-pattern-pyramid-4745 | Score: 100% | 2026-02-13T14:01:10.983627

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))