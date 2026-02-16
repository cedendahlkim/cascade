# Task: gen-ll-reverse_list-1536 | Score: 100% | 2026-02-14T12:04:43.130074

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))