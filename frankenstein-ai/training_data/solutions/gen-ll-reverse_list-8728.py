# Task: gen-ll-reverse_list-8728 | Score: 100% | 2026-02-15T09:16:40.566000

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))