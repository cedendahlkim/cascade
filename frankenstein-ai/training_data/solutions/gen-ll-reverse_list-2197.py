# Task: gen-ll-reverse_list-2197 | Score: 100% | 2026-02-13T18:34:51.908354

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))