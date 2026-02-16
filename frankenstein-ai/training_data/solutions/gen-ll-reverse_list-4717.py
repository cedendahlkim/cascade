# Task: gen-ll-reverse_list-4717 | Score: 100% | 2026-02-13T21:27:51.453210

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))