# Task: gen-ll-reverse_list-4144 | Score: 100% | 2026-02-15T11:37:19.792357

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))