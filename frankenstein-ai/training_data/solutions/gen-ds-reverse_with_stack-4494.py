# Task: gen-ds-reverse_with_stack-4494 | Score: 100% | 2026-02-13T12:23:22.195989

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))