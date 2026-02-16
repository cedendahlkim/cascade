# Task: gen-ll-reverse_list-4516 | Score: 100% | 2026-02-13T18:28:47.496812

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))