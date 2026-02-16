# Task: gen-ll-reverse_list-8058 | Score: 100% | 2026-02-13T20:33:31.768038

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))