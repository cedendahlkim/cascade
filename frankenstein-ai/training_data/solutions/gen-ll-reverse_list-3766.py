# Task: gen-ll-reverse_list-3766 | Score: 100% | 2026-02-14T12:48:42.847056

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))