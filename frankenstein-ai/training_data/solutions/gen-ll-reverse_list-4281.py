# Task: gen-ll-reverse_list-4281 | Score: 100% | 2026-02-13T18:58:41.290012

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))