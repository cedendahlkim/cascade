# Task: gen-ll-reverse_list-9011 | Score: 100% | 2026-02-15T08:48:29.159796

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))