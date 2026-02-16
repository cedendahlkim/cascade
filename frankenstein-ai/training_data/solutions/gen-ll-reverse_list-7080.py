# Task: gen-ll-reverse_list-7080 | Score: 100% | 2026-02-13T19:05:11.851185

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))