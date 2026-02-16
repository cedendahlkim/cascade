# Task: gen-ll-reverse_list-6553 | Score: 100% | 2026-02-13T18:35:02.278317

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))