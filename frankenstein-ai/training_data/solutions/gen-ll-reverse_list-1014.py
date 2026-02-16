# Task: gen-ll-reverse_list-1014 | Score: 100% | 2026-02-13T13:47:36.338101

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))