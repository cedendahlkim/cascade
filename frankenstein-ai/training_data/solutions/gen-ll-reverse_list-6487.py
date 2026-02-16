# Task: gen-ll-reverse_list-6487 | Score: 100% | 2026-02-15T10:29:10.968820

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))