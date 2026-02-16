# Task: gen-ll-reverse_list-7996 | Score: 100% | 2026-02-13T09:22:43.605163

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))