# Task: gen-ds-reverse_with_stack-9983 | Score: 100% | 2026-02-13T18:45:53.087671

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))