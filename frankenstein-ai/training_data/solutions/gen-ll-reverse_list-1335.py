# Task: gen-ll-reverse_list-1335 | Score: 100% | 2026-02-13T10:00:18.442739

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))