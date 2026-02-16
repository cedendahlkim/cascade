# Task: gen-ds-reverse_with_stack-4308 | Score: 100% | 2026-02-13T20:16:04.865596

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))