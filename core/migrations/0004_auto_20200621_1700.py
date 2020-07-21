# Generated by Django 2.2.13 on 2020-06-21 17:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_itemvariation_variation'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='item_variation',
            field=models.ManyToManyField(to='core.ItemVariation'),
        ),
        migrations.AlterField(
            model_name='itemvariation',
            name='attachment',
            field=models.ImageField(blank=True, upload_to=''),
        ),
    ]
