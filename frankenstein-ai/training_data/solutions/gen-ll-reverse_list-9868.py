# Task: gen-ll-reverse_list-9868 | Score: 100% | 2026-02-13T18:00:57.094880

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))