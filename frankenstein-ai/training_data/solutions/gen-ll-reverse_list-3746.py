# Task: gen-ll-reverse_list-3746 | Score: 100% | 2026-02-13T18:45:35.082898

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))