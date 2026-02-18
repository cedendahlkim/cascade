# Task: gen-ll-reverse_list-3083 | Score: 100% | 2026-02-17T20:00:25.162404

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))