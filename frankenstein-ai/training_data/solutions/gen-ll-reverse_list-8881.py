# Task: gen-ll-reverse_list-8881 | Score: 100% | 2026-02-13T20:33:35.948485

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))