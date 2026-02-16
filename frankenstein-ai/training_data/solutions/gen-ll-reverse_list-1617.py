# Task: gen-ll-reverse_list-1617 | Score: 100% | 2026-02-13T13:42:38.329121

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))