# Task: gen-ll-reverse_list-2358 | Score: 100% | 2026-02-15T09:01:47.309387

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))