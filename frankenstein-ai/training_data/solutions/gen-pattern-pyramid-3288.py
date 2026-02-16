# Task: gen-pattern-pyramid-3288 | Score: 100% | 2026-02-13T18:51:35.919492

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))