# Task: gen-ll-reverse_list-3510 | Score: 100% | 2026-02-15T11:12:39.747532

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))